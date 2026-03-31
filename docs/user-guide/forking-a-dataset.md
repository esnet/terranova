# Forking a Dataset

Forking creates a new dataset that starts with the same query definition (endpoint and filters) as an existing dataset. It is useful when you want to create a variation of a dataset — for example, querying a different subset of the same data — without modifying the original.

## How to fork

1. Navigate to **Libraries → Datasets → Create New Dataset** or go to `/dataset/new`
2. Toggle **Fork Existing Dataset** on
3. Select the **Dataset Name** you want to fork from
4. Select the **Version** of that dataset to use as the starting point
5. Give your new dataset a name
6. Click **Create Dataset**

The new dataset is created with the same `query` (endpoint + filters) as the selected version of the source dataset. It gets a new `datasetId` and starts at version 1.

## Forking vs. editing

| | Fork | Edit existing |
|---|---|---|
| Creates a new dataset? | Yes | No |
| Affects the original? | No | Yes (new version) |
| Use when… | You want a variation without changing the source | You want to update the dataset in place |

## After forking

The Dataset Editor opens on the new dataset. You can immediately modify the filters, change the endpoint, or adjust deduplication settings without affecting the source dataset.
