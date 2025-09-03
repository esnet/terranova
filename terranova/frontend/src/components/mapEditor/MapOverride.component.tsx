import { Icon } from "../Icon.component";
import { OVERRIDE_TYPES, OVERRIDE_OPERATIONS } from "../../data/constants";
import { FocusTextArea } from "./FocusTextArea.component";

export function MapOverride(props: any) {
    return (
        <>
            <tr>
                <td className="controls w-24">
                    <div className="flex flew-row w-24">
                        <Icon
                            name={props.override.visible ? "eye" : "eye-off"}
                            className="btn icon bordered h-9 w-9 mr-2"
                            onClick={props.toggleVisibility}
                        />
                        <Icon
                            name="trash"
                            className="btn icon bordered h-9 w-9"
                            onClick={props.delete}
                        />
                    </div>
                </td>
                <td className="operation pl-0">
                    <select
                        className="w-full min-w-[4rem]"
                        defaultValue={props.override.operation}
                        onChange={(e) => {
                            props.setOperation(e.target.value);
                        }}
                    >
                        {OVERRIDE_OPERATIONS.map((op) => {
                            return (
                                <option value={op.value} key={op.value}>
                                    {op.label}
                                </option>
                            );
                        })}
                    </select>
                </td>
                <td className="datatype pl-0">
                    <select
                        className="w-full min-w-[4rem]"
                        defaultValue={props.override.type}
                        onChange={(e) => {
                            props.setType(e.target.value);
                        }}
                    >
                        {OVERRIDE_TYPES.map((type) => {
                            return (
                                <option value={type.value} key={type.value}>
                                    {type.label}
                                </option>
                            );
                        })}
                    </select>
                </td>
                <td className="where text-center w-12 px-0">
                    <label className="pr-0">named</label>
                </td>
                <td className="value">
                    <div className="flex flex-row">
                        <div className="w-6/12">
                            <input
                                type="text"
                                className="mr-36"
                                value={props.override.name}
                                onChange={(e) => {
                                    props.setName(e.target.value);
                                }}
                            />
                        </div>
                        <div className="w-6/12 text-right">
                            <label className="pr-0">
                                For Dataset "
                                {props.override.datasetName || props.override.datasetId}"
                            </label>
                        </div>
                    </div>
                </td>
            </tr>
            {props.override.operation != "delete" ? (
                <tr key="override-${props.override.type}-${props.override.name}-state">
                    <td colSpan={5}>
                        <div className="flex flex-row">
                            <div className="w-4/12 text-right pl-0 pr-2">
                                <label className="pr-0">with contents:</label>
                            </div>
                            <div className="w-8/12">
                                <FocusTextArea
                                    type="text"
                                    className="w-full"
                                    value={JSON.stringify(props.override.state)}
                                    onChange={(event: any) => {
                                        props.setState(JSON.parse(event.target.value));
                                    }}
                                />
                            </div>
                        </div>
                    </td>
                </tr>
            ) : null}
        </>
    );
}
