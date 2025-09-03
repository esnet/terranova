import React from "react";

export function TemplatePreview(props: any) {
    let [width, setWidth] = React.useState(0);
    let container = React.createRef<HTMLDivElement>();
    let [wrappedSvg, setWrappedSvg] = React.useState("");

    let crosshairs = `<line
        x1="0"
        y1="-25"
        x2="0"
        y2="25"
        stroke-dasharray="1,1"
        stroke="rebeccapurple"
        stroke-width="0.1"
        stroke-opacity="0.5" />
      <line
        x1="-25"
        y1="0"
        x2="25"
        y2="0"
        stroke-dasharray="1,1"
        stroke="rebeccapurple"
        stroke-width="0.1"
        stroke-opacity="0.5" />`;

    return (
        <fieldset className="content-sidebar">
            <h4>Node Template Builder</h4>
            <p>
                You can use SVG to style the nodes on your map. Each node is wrapped in a &nbsp;
                <span className="highlight monospace">&lt;g&gt;</span>&nbsp; ("group") element and
                scaled appropriately in the map application.
            </p>

            <h5>Node Preview</h5>

            <div className="template-preview" ref={container}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="-25 -25 50 50"
                    dangerouslySetInnerHTML={{ __html: `${props.instance.template}${crosshairs}` }}
                ></svg>
            </div>

            <h5>Scaled Node Preview</h5>

            <div className="w-6 h-6 border bg-white mx-auto">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="-6 -6 12 12"
                    dangerouslySetInnerHTML={{ __html: `${props.instance.template}` }}
                ></svg>
            </div>

            <p className="aside text-sm mt-6">
                <em>
                    The scaled preview shows the SVG element scaled to the approximate real size of
                    map nodes.
                </em>
            </p>

            <p className="aside pt-6">Notes on formatting:</p>
            <ul className="aside">
                <li className="block">&bull; A stroke will be applied in the resulting map</li>
                <li className="block">&bull; A fill applied in the resulting map</li>
                <li className="block">
                    &bull; Nodes are generally ~10px in width in geographic maps
                </li>
                <li className="block">
                    &bull; Nodes are scaled using: &nbsp;
                    <br />
                    <span className="highlight monospace">height</span>,&nbsp;
                    <span className="highlight monospace">width</span>,&nbsp;
                    <span className="highlight monospace">x</span>, and{" "}
                    <span className="highlight monospace">y</span>. <br />
                    To scale properly, wrap your element in:
                    <br />
                    <span className="highlight monospace">&lt;svg viewBox&gt;</span>.
                </li>
            </ul>
        </fieldset>
    );
}
