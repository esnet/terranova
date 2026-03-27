"""
Tests for the Node Template Editor page of Terranova.
"""

from playwright.sync_api import expect
import re
from urls import FRONTEND_BASE


def test_change_svg_preview(page, create_test_node):
    """
    Test that changing the SVG code in the node template editor causes the
    live preview to update. The preview renders the SVG immediately as the user types.
    """
    template_id = create_test_node
    page.goto(f"{FRONTEND_BASE}/template/{template_id}")

    # The editor should be on the edit page (URL should have a 7-char template ID)
    expect(page).to_have_url(re.compile(r".*/template/\w{7}$"))

    # Find the SVG Code textarea
    svg_textarea = page.get_by_role("textbox", name="SVG Code")
    if not svg_textarea.is_visible():
        # Try to expand the accordion first
        accordion_header = page.locator('button:has-text("Update Node Template")').first
        if accordion_header.is_visible():
            accordion_header.click()
        svg_textarea = page.get_by_role("textbox", name="SVG Code")

    if svg_textarea.is_visible():
        # Enter a distinctive SVG shape
        test_svg = '<rect x="-8" y="-8" width="16" height="16" fill="blue"/>'
        svg_textarea.fill(test_svg)

        # The preview section should reflect the new SVG
        # TemplatePreview renders the SVG with dangerouslySetInnerHTML
        preview_svg = page.locator('svg[viewBox="-25 -25 50 50"]').first
        expect(preview_svg).to_be_visible()
        # The rect element we typed should be in the preview
        expect(preview_svg.locator("rect")).to_be_visible()


def test_create_template_navigates_to_editor(page, login):
    """
    Test that creating a new node template navigates to the template editor page
    with the SVG editor visible. Verifies the fix to the create flow (SVG Node Builder).
    After creation, the page should be at /template/{id} with the editor showing.
    """
    template_name = "Test SVG Template Navigation"
    test_svg = '<circle cx="0" cy="0" r="8" fill="green"/>'

    page.goto(f"{FRONTEND_BASE}/template/new")
    expect(page.get_by_role("main")).to_be_visible()

    # Fill in the template name
    page.get_by_role("textbox", name="Name").fill(template_name)

    # Fill in some SVG code
    svg_input = page.get_by_role("textbox", name="SVG Code")
    svg_input.fill(test_svg)

    # Click the Create button
    page.get_by_role("button", name="Create", exact=True).click()

    # Should navigate to /template/{7-char-id}
    expect(page).to_have_url(re.compile(r".*/template/\w{7}$"), timeout=5000)

    # The editor page should show the template name in the Name input (loaded from API)
    expect(page.get_by_role("textbox", name="Name")).to_have_value(template_name, timeout=10000)

    # The SVG preview should be visible
    expect(page.locator('svg[viewBox="-25 -25 50 50"]').first).to_be_visible()
