import React from "react";
import Card from "./Card";

const crosshairs = `<line
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

export function TemplatePreview(props: any) {
    let container = React.createRef<HTMLDivElement>();

    return (
        <Card className="w-auto xl:w-full">
            <h4>Node Template Builder</h4>
            <p>
                You can use SVG to style the nodes on your map. Each node is wrapped in a &nbsp;
                <code>g</code> (group) element and scaled appropriately in the map application.
            </p>

            <h5 className="text-center">Node Preview</h5>

            <div className="w-64 h-64 m-auto border bg-white mb-4" ref={container}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="-25 -25 50 50"
                    dangerouslySetInnerHTML={{ __html: `${props.instance.template}${crosshairs}` }}
                ></svg>
            </div>

            <h5 className="text-center">Scaled Node Preview</h5>

            <div className="w-6 h-6 border bg-white mx-auto mb-4">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="-6 -6 12 12"
                    dangerouslySetInnerHTML={{ __html: `${props.instance.template}` }}
                ></svg>
            </div>

            <em className="pb-8 block text-center">
                The scaled preview shows the SVG element scaled to the approximate real size of map
                nodes.
            </em>

            <p>Notes on formatting:</p>
            <ul>
                <li>A stroke and a fill will be applied in the resulting map</li>
                <li>Nodes are generally ~10px in width in geographic maps</li>
                <li>
                    Nodes are scaled using <code>width</code>, <code>height</code>, <code>x</code>,
                    and <code>y</code>. To scale properly, wrap your element in:{" "}
                    <code>&lt;svg viewBox&gt;</code>
                </li>
            </ul>
        </Card>
    );
}
