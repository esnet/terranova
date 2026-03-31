# Making Your First Map

This tutorial walks you through the full workflow end-to-end: connecting a Google Sheet containing network topology data, building a dataset from it, and composing that dataset into an interactive map.

By the end you will have a working map visible in Terranova's editor and ready to embed or share.

!!! note "Prerequisites"
    - A running Terranova instance (see [Quickstart](quickstart.md))
    - A Google Sheets spreadsheet in the [Terranova Topology Format](https://docs.google.com/spreadsheets/d/191BuMoWa2CooMXJQzyNtBRlNLHamBmh-8PCoIGDELxA/edit) — you can make a copy of the example sheet to use as test data

---

## Step 1: Connect your Google Sheet

Terranova reads topology data from Google Sheets via a service account. If you haven't done this yet, follow the [Google Sheets Setup](../deployment/google-sheets-setup.md) guide and come back here once your credentials are in place.

Once the credential file is installed at `/etc/terranova/private_jwt.json` and your `settings.yml` has the `google_sheets` datasource configured, refresh the local data cache:

```sh
make fetch
```

This fetches data from all spreadsheets shared with your service account and stores it locally. You should see output indicating which sheets were loaded.

> **📸 SCREENSHOT PLACEHOLDER** — `step-01-make-fetch-output.png`
> _Terminal showing successful `make fetch` output with sheets listed_

---

## Step 2: Log in to Terranova

Open Terranova in your browser and log in.

> **📸 SCREENSHOT PLACEHOLDER** — `step-02-login.png`
> _Login page with username/password fields_

After logging in you will see the home page with the sidebar on the left.

> **📸 SCREENSHOT PLACEHOLDER** — `step-03-home.png`
> _Home page with sidebar visible_

---

## Step 3: Create a dataset

A dataset defines which circuits from your Google Sheet to include on the map. You need one before you can build a map.

**3a.** In the left sidebar, click **Libraries → Datasets**, then click **Create New Dataset**.

> **📸 SCREENSHOT PLACEHOLDER** — `step-04-sidebar-datasets.png`
> _Sidebar with Libraries → Datasets highlighted and "Create New Dataset" button visible_

**3b.** Give your dataset a name — something descriptive like `My Network Circuits` — and click **Create Dataset**.

> **📸 SCREENSHOT PLACEHOLDER** — `step-05-dataset-creator.png`
> _Dataset creator form with name filled in_

Terranova creates the dataset and drops you into the Dataset Editor.

---

## Step 4: Configure the dataset query

The Dataset Editor is where you tell Terranova exactly which data to use.

**4a.** In the **Query Panel** at the bottom of the page, open the **Endpoint** dropdown. You should see your Google Sheet listed — select it.

> **📸 SCREENSHOT PLACEHOLDER** — `step-06-endpoint-dropdown.png`
> _Query Panel with endpoint dropdown open showing a Google Sheet option_

**4b.** Click **Add Filter**. Filters narrow down which circuits are included. For your first map, add a simple filter to include everything — for example, filter on a field that all rows have in common (such as a circuit type or region name that matches all your records).

> **📸 SCREENSHOT PLACEHOLDER** — `step-07-add-filter.png`
> _Query Panel with a filter added_

!!! tip
    A dataset with no filters returns no data. At least one filter is required. If you just want to see everything from the sheet, filter on a field that all rows share.

**4c.** Click **Save Changes**. Terranova runs the query and stores the results. After saving, the visualization preview should populate with nodes and edges.

> **📸 SCREENSHOT PLACEHOLDER** — `step-08-dataset-preview.png`
> _Dataset Editor showing a populated logical topology preview with nodes and edges_

If the preview is empty, check that your filter matches actual data in the sheet. Switch to **Table View** in the sidebar to inspect the raw records.

---

## Step 5: Create a map

Now that you have a dataset, you can compose it into a map.

**5a.** In the left sidebar, click **Libraries → Maps**, then click **Create New Map**.

> **📸 SCREENSHOT PLACEHOLDER** — `step-09-sidebar-maps.png`
> _Sidebar with Libraries → Maps and "Create New Map" visible_

**5b.** Give your map a name and click **Create Map**.

> **📸 SCREENSHOT PLACEHOLDER** — `step-10-map-creator.png`
> _Map creator form with name filled in_

---

## Step 6: Add your dataset as a map layer

The Map Editor opens on a blank map. You need to add your dataset as a layer.

**6a.** In the **Layer Options Panel** at the bottom, click **Add Layer**. A new layer row appears.

> **📸 SCREENSHOT PLACEHOLDER** — `step-11-add-layer.png`
> _Layer Options Panel with "Add Layer" button and a new empty layer row_

**6b.** In the new layer row, open the **Dataset** dropdown and select the dataset you just created.

> **📸 SCREENSHOT PLACEHOLDER** — `step-12-select-dataset.png`
> _Layer row with dataset dropdown open and a dataset selected_

**6c.** Set a **Name** for the layer (shown in the map legend) and choose a **Color**.

> **📸 SCREENSHOT PLACEHOLDER** — `step-13-layer-config.png`
> _Layer row with name and color configured_

**6d.** The map preview should now show your network topology. If nodes appear but edges don't (or vice versa), check that the **Endpoint ID**, **Source**, and **Destination** fields in the layer config match the column names in your Google Sheet.

> **📸 SCREENSHOT PLACEHOLDER** — `step-14-map-preview.png`
> _Map Editor showing a populated map with nodes and edges visible_

---

## Step 7: Set the viewport and save

**7a.** Pan and zoom the map preview to frame the area you want shown by default.

**7b.** Click **Save Map** in the top right. A confirmation appears briefly.

> **📸 SCREENSHOT PLACEHOLDER** — `step-15-save-map.png`
> _Map Editor topbar with "Save Map" button and save confirmation visible_

That's it — you've built your first Terranova map.

---

## What's next

- **Embed the map** — see [Map Output](../user-guide/map-output.md) to publish the map and generate an embed URL
- **Refine the data** — go back to the Dataset Editor to adjust filters or try different endpoints
- **Style the map** — experiment with colors, edge widths, and the threshold settings in the Layer Options Panel
- **Add more layers** — create additional datasets and add them as separate layers on the same map

