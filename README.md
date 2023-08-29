# GEE in Node.js
> Dongdong Kong, CUG


## GEE authentication

- `Private Key`: <https://developers.google.com/earth-engine/guides/service_account#create-a-private-key-for-the-service-account>
  
> `Private Key` should be at `~/.config/earthengine/.private-key.json`.


## Node.js

```bash
npm install -g @google/earthengine require-from-url ijavascript
ijavascript
```

## Jupyter

```bash
conda install nb_conda_kernels ipykernel
python -m ipykernel install --user --name=`YOUR_ENV_NAME`
```
