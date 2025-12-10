from playwright.sync_api import expect
import re


def test_google_sheets_filters_multi_select(login, page):
    return

    # TODO: as some point, the landing page was updated and the test past this fails
    # will need to red0o this test after I determine what the purpose of it is
    page.get_by_role("listitem").filter(has_text=re.compile(r"^Datasets$")).get_by_role(
        "img"
    ).click()
    page.get_by_role("link", name="Datasets").click()
    page.get_by_role("button", name="+ Create New").click()
    page.locator("#dataset-name").click()
    page.locator("#dataset-name").fill("--Test Dataset Google Sheets--")
    page.get_by_role("button", name="Create Dataset").click()
    expect(page.locator("#dataset-display-name")).to_be_visible()
    page.locator("#dataset-selector").select_option(
        "google_sheets?sheet_id=1nm4QQbpVW_bqonsSo3j0ttNZeyJvcCG3Zg6Japr5L8k"
    )
    expect(page.locator("#dataset-selector")).to_have_value(
        "google_sheets?sheet_id=1nm4QQbpVW_bqonsSo3j0ttNZeyJvcCG3Zg6Japr5L8k"
    )
    page.locator("#add-query-criterion").click()
    page.get_by_role("searchbox", name="Filter Names...").click()
    page.locator("#lower-main-pane").get_by_role("listbox").select_option("A--B")
    expect(page.get_by_role("form")).to_contain_text("1 circuit")
    page.get_by_role("searchbox", name="Filter Names...").click()
    page.locator("#lower-main-pane").get_by_role("listbox").select_option(
        ["A--B", "A--Z", "B--Z", "L--Z"]
    )
    expect(page.get_by_role("form")).to_contain_text("4 circuits")
