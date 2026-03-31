# Creating a Dataset

A dataset defines a query against a datasource. You need at least one dataset before you can create a map.

## Steps

### 1. Open the dataset creator

In the left sidebar, click **Libraries → Datasets**, then click **Create New Dataset**. Or navigate directly to `/dataset/new`.

### 2. Name your dataset

Enter a descriptive name in the **Name** field. Choose something that reflects the data you intend to query — for example, `US Core Circuits` or `WAN Backbone Links`.

### 3. Optionally fork from an existing dataset

If you want to start from an existing dataset's query rather than from scratch, toggle **Fork Existing Dataset** on, then select:

- **Dataset Name** — the dataset to copy the query from
- **Version** — which version of that dataset to use as the starting point

Forking copies the query definition (endpoint and filters) into your new dataset. Changes to the new dataset do not affect the original. See [Forking a Dataset](forking-a-dataset.md) for details.

### 4. Click Create Dataset

Terranova creates the dataset and navigates to the [Dataset Editor](dataset-editor.md), where you can define filters and preview the topology data.

## Next steps

After creating a dataset, you'll want to:

1. Select a datasource **endpoint** in the Dataset Editor
2. Add **filters** to narrow down the circuits to display
3. Preview the data in logical, geographic, or table view
4. Save the dataset
5. [Create a map](creating-a-map.md) that uses this dataset as a layer
