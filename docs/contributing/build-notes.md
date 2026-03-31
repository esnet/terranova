## Build Notes

Currently, we use the vite build environment system to parameterize some information surrounding different build environments.

You'll see a few files related to this in the source tree:

```
terranova/frontend/.env.production
terranova/frontend/.env.staging
terranova/frontend/.env.development
```

### Vite Environment Files

Each of the vite environment files define a number of settings that may (or may not!) vary in the different contexts:

This is an example of the staging values as of this writing:
```
VITE_API_URL=https://terranova-dev.es.net/terranova/api/v1
VITE_OIDC_REDIRECT_URI=https://terranova-dev.es.net/
VITE_OIDC_LOGOUT_REDIRECT_URI=https://terranova-dev.es.net/login?next=/&message=You+have+been+logged+out.
VITE_LAYER_LIMIT=3
VITE_CACHE_DURATION_IN_SECONDS=60
VITE_TOOLTIP_TTL=2
VITE_D3_SCRIPT_TAG=<script type="module">import "/static/d3.min.js";</script>
```

As of this writing, these variables *must* be prefixed with `VITE`. This allows vite (the frontend build/develop JS ecosystem... management... thing) to recognize that these are values that it should make available to downstream templates.

#### Notes on the D3 and Leaflet Externalized Deps

Astute readers will have noticed that there is a random `<script>` tag thrown into the staging settings code listing above.

Astute readers may be asking themselves, "Why is that there?"

It appears that the engagemap code really wants these particular dependency to be external to the main minified build file. This is definitely something that we'll want to fix or resolve in the build system for the engagemap. 

A *really* astute reader may have noticed that this script tag doesn't appear in the resultant index.html. The really astute reader is probably also asking themselves, "Why?"

The imports for `/static/d3.min.js` are both rolled up into the build "rollup" file -- it slurps this script tag out of HTML and puts it there. It's important to note that these files *must still exist* in the resultant dist files. Because these modules are expressly called out as external deps in `build.rollupOptions.external`, vite decides that these files are all allowed to be external deps. Really astute readers have also looked over the package.json and realized that there's a `cp` command that deals with putting these particular files in "the right place" in the resultant build (`/static`, currently)
