"""
Tests for _render_custom_legend() in terranova/api/routers/output.py.

Covers:
- timestamps mode: template is rendered with layer data
- grafana mode: customLegend=False, nothing rendered
- custom mode: no data-tn-legend attr, value passed through unchanged
- missing/empty template: no-op
- multiple layers
- missing timestamp fields in layer data
"""
import json
import pytest
from terranova.api.routers.output import _render_custom_legend

TIMESTAMPS_TEMPLATE = (
    '<div data-tn-legend="timestamps" class="tn-timestamp-legend">'
    "{% for layer in layers %}"
    '<div class="tn-timestamp-layer">'
    "<p><em>{{ layer.name }}</em></p>"
    '{% if layer.render_time %}<p><strong>Rendered:</strong> {{ layer.render_time.strftime("%-I:%M %p, %b %-d %Y") }}</p>{% endif %}'
    '{% if layer.last_sync_time %}<p><strong>Last sync:</strong> {{ layer.last_sync_time.strftime("%-I:%M %p, %b %-d %Y") }}</p>{% endif %}'
    "{% if layer.datasource_version %}<p><strong>Mode:</strong> {{ layer.datasource_version }}</p>{% endif %}"
    "</div>"
    "{% endfor %}"
    "</div>"
)


def _make_map(custom_legend, custom_legend_value, layers_mapjson):
    class FakeCfg:
        pass

    cfg = FakeCfg()
    cfg.customLegend = custom_legend
    cfg.customLegendValue = custom_legend_value

    class FakeLayer:
        pass

    cfg.layers = []
    for name, topo in layers_mapjson:
        layer = FakeLayer()
        layer.name = name
        layer.mapjson = json.dumps(topo)
        cfg.layers.append(layer)

    class FakeMap:
        configuration = cfg

    return FakeMap(), cfg


class TestRenderCustomLegend:

    def test_timestamps_mode_renders_layer_name(self):
        m, cfg = _make_map(
            True, TIMESTAMPS_TEMPLATE,
            [("ESnet Backbone", {"render_time": "2026-11-18T12:00:00+00:00",
                                  "last_sync_time": None,
                                  "datasource_version": "realtime"})]
        )
        _render_custom_legend(m)
        assert "ESnet Backbone" in cfg.customLegendValue

    def test_timestamps_mode_renders_render_time(self):
        m, cfg = _make_map(
            True, TIMESTAMPS_TEMPLATE,
            [("Layer A", {"render_time": "2026-11-18T12:00:00+00:00",
                          "last_sync_time": None,
                          "datasource_version": None})]
        )
        _render_custom_legend(m)
        assert "Rendered:" in cfg.customLegendValue

    def test_timestamps_mode_renders_last_sync_time(self):
        m, cfg = _make_map(
            True, TIMESTAMPS_TEMPLATE,
            [("Layer A", {"render_time": None,
                          "last_sync_time": "2026-11-17T06:00:00+00:00",
                          "datasource_version": None})]
        )
        _render_custom_legend(m)
        assert "Last sync:" in cfg.customLegendValue

    def test_timestamps_mode_renders_datasource_version(self):
        m, cfg = _make_map(
            True, TIMESTAMPS_TEMPLATE,
            [("Layer A", {"render_time": None,
                          "last_sync_time": None,
                          "datasource_version": "realtime"})]
        )
        _render_custom_legend(m)
        assert "Mode:" in cfg.customLegendValue
        assert "realtime" in cfg.customLegendValue

    def test_timestamps_mode_omits_missing_fields(self):
        m, cfg = _make_map(
            True, TIMESTAMPS_TEMPLATE,
            [("Layer A", {"render_time": "2026-11-18T12:00:00+00:00",
                          "last_sync_time": None,
                          "datasource_version": None})]
        )
        _render_custom_legend(m)
        assert "Last sync:" not in cfg.customLegendValue
        assert "Mode:" not in cfg.customLegendValue

    def test_timestamps_mode_multiple_layers(self):
        m, cfg = _make_map(
            True, TIMESTAMPS_TEMPLATE,
            [
                ("Layer 1", {"render_time": "2026-11-18T12:00:00+00:00", "last_sync_time": None, "datasource_version": "realtime"}),
                ("Layer 2", {"render_time": "2026-11-18T11:00:00+00:00", "last_sync_time": "2026-11-18T10:00:00+00:00", "datasource_version": "snapshot"}),
            ]
        )
        _render_custom_legend(m)
        assert "Layer 1" in cfg.customLegendValue
        assert "Layer 2" in cfg.customLegendValue
        assert "snapshot" in cfg.customLegendValue

    def test_grafana_mode_no_render(self):
        m, cfg = _make_map(
            False, TIMESTAMPS_TEMPLATE,
            [("Layer A", {"render_time": "2026-11-18T12:00:00+00:00"})]
        )
        original = cfg.customLegendValue
        _render_custom_legend(m)
        assert cfg.customLegendValue == original  # unchanged

    def test_custom_mode_passthrough(self):
        custom_html = "<p>My custom legend</p>"
        m, cfg = _make_map(True, custom_html, [])
        _render_custom_legend(m)
        assert cfg.customLegendValue == custom_html

    def test_empty_template_no_op(self):
        m, cfg = _make_map(True, "", [])
        _render_custom_legend(m)
        assert cfg.customLegendValue == ""

    def test_none_template_no_op(self):
        m, cfg = _make_map(True, None, [])
        _render_custom_legend(m)
        assert cfg.customLegendValue is None

    def test_malformed_template_does_not_raise(self):
        m, cfg = _make_map(True, "{% for x in %}", [])
        # Should log a warning and not raise
        _render_custom_legend(m)
