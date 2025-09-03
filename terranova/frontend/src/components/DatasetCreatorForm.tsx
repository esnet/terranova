export function DatasetCreatorForm(props: any) {
    function setProperty(propertyName: string) {
        // do this in a closure so we can reuse a single setter
        return function (event: { target: { value: any } }) {
            if (!props.instanceSetter) return;
            var value = event.target.value;
            props.instance[propertyName] = value;
            props.instanceSetter({ ...props.instance }); // I hate you, react
        };
    }

    function setForkDataset(event: { target: { checked: any } }) {
        // set the fork property
        // set the forkDataset property to the first available dataset from the <select>
        props.instance.fork = event.target.checked;
        if (!props.instance?.forkDataset) {
            props.instance.forkDataset = props.datasetList[0].datasetId;
            props.instance.forkDatasetVersion = props.datasetList[0].version;
        }
        props.instanceSetter({ ...props.instance });
    }

    function renderDatasetListOptions() {
        var hashTable = props.datasetList.reduce((agg: any, dataset: any) => {
            agg[dataset.datasetId] = dataset.name;
            return agg;
        }, {});
        var options = [];
        for (let [datasetId, name] of Object.entries(hashTable)) {
            options.push(
                <option value={datasetId} key={datasetId}>
                    {`${name}`}
                </option>
            );
        }
        return options;
    }

    function renderDatasetVersionOptions() {
        var hashTable = props.datasetList.reduce((agg: any, dataset: any) => {
            if (agg[dataset.datasetId]) {
                agg[dataset.datasetId].push(dataset);
                agg[dataset.datasetId].sort((a: any, b: any) => {
                    // sort by version descending. reverse signs or comparison for opposite sort.
                    return a.version > b.version ? -1 : 1;
                });
            } else {
                agg[dataset.datasetId] = [dataset];
            }
            return agg;
        }, {});
        var options = hashTable[props.instance.forkDataset]?.map((version: any) => {
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
        return (
            <fieldset className="subgroup px-6 pb-6">
                <legend>Fork Existing Dataset Options</legend>
                <div>
                    <label className="strong">Dataset Name</label>
                </div>
                <div>
                    <select
                        value={props.instance.forkDataset}
                        onChange={setProperty("forkDataset")}
                    >
                        {renderDatasetListOptions()}
                    </select>
                </div>
                <div>
                    <label className="strong">Version</label>
                </div>
                <div>
                    <select
                        value={props.instance.forkDatasetVersion}
                        onChange={setProperty("forkDatasetVersion")}
                    >
                        {renderDatasetVersionOptions()}
                    </select>
                </div>
            </fieldset>
        );
    }

    return (
        <form onSubmit={props.createDataset}>
            <div className="panel-header">Create New Dataset</div>
            <div className="panel-body">
                <div>
                    <label>Name</label>
                </div>
                <div>
                    <input
                        type="text"
                        name="name"
                        className="w-fit"
                        id="dataset-name"
                        value={props.instance.name}
                        onChange={setProperty("name")}
                        required
                    />
                </div>
                <div>
                    <label>Fork Existing Dataset</label>
                </div>
                <div>
                    <input
                        type="checkbox"
                        name="fork"
                        className="switch"
                        onChange={setForkDataset}
                    />
                </div>
                {renderForkOptions()}
            </div>
            <div className="panel-footer flex-row flex justify-end">
                <a href="/" className="btn text-black mr-4">
                    Cancel
                </a>
                <input
                    type="submit"
                    id="create-dataset-confirm"
                    className="primary"
                    value="Create Dataset"
                />
            </div>
        </form>
    );
}
