# Terranova Release Process

## Building Code

From the top-level checkout directory, run

```
git checkout develop
git pull
make build
```

This builds JavaScript artefacts. JS settings files (/static/settings.js) are built by ansible at deploy time.

You'll want to add and commit the distribution files (noting the `-n` flag on commit: Do not run pre-commit `prettify` on distribution files)

## Terranova Dev deployments

```
git checkout develop
git add terranova/frontend/dist
git commit -n -m "build artefacts"
git push origin develop
```

These notes assume you're committing the build artefacts directly to `develop`. This may or may not be the case in reality. If you're not committing to develop, make a merge request, have the merge request merged, and continue with the remainder of the deployment.

The deployment is ansible-managed. You should:

- ensure that you have `jkafader/ansible-inf` checked out at `~/work/ansible-inf`
- have an ansible virtualenv (or globally-installed package for extra risk!)
- activate your ansible virtualenv (because you chose the correct option)
- have the `MyESnet - Ansible Vault` secret from 1Password stored in `~/terranova_vault_password.txt`

```
ansible-playbook -i ansible/inventory --extra-vars "initial_setup=True" --vault-password-file ~/terranova_vault_password.txt ansible/terranova-dev.yml
```

## Deploying to Staging

Once you've verified that the development deployment is ready to go, you'll want to merge to main and tag a release

Branch management:
```
git checkout develop
git pull
git checkout main
git pull
git merge develop
```

Tag the release:
```
git tag vN.N.N
```

Push branches and tags:
```
git push origin main
git push origin --tags
```

Deploy staging via Ansible CLI:
```
ansible-playbook -i ansible/inventory --extra-vars "initial_setup=True" --vault-password-file ~/terranova_vault_password.txt ansible/terranova-staging.yml
```

## Deploying to Production

You've already done the file management part, so this is shorter than staging:
```
ansible-playbook -i ansible/inventory --extra-vars "initial_setup=True" --vault-password-file ~/terranova_vault_password.txt ansible/terranova-prod.yml
ansible-playbook -i ansible/inventory --extra-vars "initial_setup=True" --vault-password-file ~/terranova_vault_password.txt ansible/terranova-internal.yml
```

## Deploy Service Diagrams

Whenever we're doing a prod deployment, ensure that you also deploy the service diagram periodic generation script. The service diagram generation script is deployed from a separate repo:
```
https://gitlab.es.net/stardust/service-diagram-generation
```

When this is deployed, check that we're still using the same mapId for service diagram generation, in `generate_diagrams.sh`. If it has changed, make sure to update it:
```
MAPID=TTxjjP7
```

and then `git add`, `git commit` and `git push` the change.

For each prod deployment, we should also ensure that we redeploy the service diagram generation scripts:
```
cd ~/work/service_diagram_generation
ansible-playbook -i ansible/inventory --extra-vars "initial_setup=True" --vault-password-file ~/terranova_vault_password.txt ansible/deploy.yml
```
