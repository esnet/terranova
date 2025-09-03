export function MapCreatorForm(props: any) {
    function setProperty(propertyName: string) {
        // do this in a closure so we can reuse a single setter
        return function (event: { target: { value: any } }) {
            if (!props.instanceSetter) return;
            var value = event.target.value;
            props.instance[propertyName] = value;
            props.instanceSetter({ ...props.instance }); // I hate you, react
        };
    }

    function setForkMapDefaults() {
        if (!props.instance?.forkMap) {
            props.instance.forkMap = props?.mapList?.[0]?.mapId;
            props.instance.forkMapVersion = props?.mapList?.[0]?.version;
        }
    }

    function setForkMap(event: { target: { checked: any } }) {
        // set the fork property
        // set the forkMap property to the first available map from the <select>
        props.instance.fork = event.target.checked;
        setForkMapDefaults();
        props.instanceSetter({ ...props.instance });
    }

    function renderMapListOptions() {
        console.log("renderMapListOptions");
        var hashTable = props.mapList.reduce((agg: any, map: any) => {
            agg[map.mapId] = map.name;
            return agg;
        }, {});
        var options = [];
        for (let [mapId, name] of Object.entries(hashTable)) {
            options.push(
                <option value={mapId} key={mapId}>
                    {`${name}`}
                </option>
            );
        }
        console.log("end renderMapListOptions");
        return options;
    }

    function renderMapVersionOptions() {
        var hashTable = props.mapList.reduce((agg: any, map: any) => {
            if (agg[map.mapId]) {
                agg[map.mapId].push(map);
            } else {
                agg[map.mapId] = [map];
            }
            return agg;
        }, {});
        for (let mapId in hashTable) {
            if (hashTable.hasOwnProperty(mapId)) {
                hashTable[mapId].sort((a: any, b: any) => {
                    // sort by version descending. reverse signs or comparison for opposite sort.
                    return a.version > b.version ? -1 : 1;
                });
            }
        }
        var options = hashTable[props.instance.forkMap]?.map((version: any) => {
            return (
                <option key={version.version} value={version.version}>
                    v{version.version} [{version.lastUpdatedOn.toLocaleString()}]
                </option>
            );
        });
        return options;
    }

    function renderForkOptions() {
        if (!props.instance?.fork) return null;

        if (!props?.mapList?.length) {
            return (
                <fieldset className="subgroup px-6 pb-6">
                    <legend>Fork Existing Map Options</legend>
                    <label>Loading Map Options...</label>
                </fieldset>
            );
        }

        setForkMapDefaults();

        return (
            <fieldset className="subgroup px-6 pb-6">
                <legend>Fork Existing Map Options</legend>
                <div>
                    <label className="strong">Map Name</label>
                </div>
                <div>
                    <select value={props.instance.forkMap} onChange={setProperty("forkMap")}>
                        {renderMapListOptions()}
                    </select>
                </div>
                <div>
                    <label className="strong">Version</label>
                </div>
                <div>
                    <select
                        value={props.instance.forkMapVersion}
                        onChange={setProperty("forkMapVersion")}
                    >
                        {renderMapVersionOptions()}
                    </select>
                </div>
            </fieldset>
        );
    }

    return (
        <form onSubmit={props.createMap}>
            <div className="panel-header">Create New Map</div>
            <div className="panel-body">
                <div>
                    <label>Name</label>
                </div>
                <div>
                    <input
                        type="text"
                        name="name"
                        className="w-fit"
                        value={props.instance.name}
                        onChange={setProperty("name")}
                        required
                    />
                </div>
                <div>
                    <label>Fork Existing Map</label>
                </div>
                <div>
                    <input type="checkbox" name="fork" className="switch" onChange={setForkMap} />
                </div>
                {renderForkOptions()}
            </div>
            <div className="panel-footer flex-row flex justify-end">
                <a href="/" className="btn text-black mr-4">
                    Cancel
                </a>
                <input type="submit" className="primary" value="Create Map" />
            </div>
        </form>
    );
}
