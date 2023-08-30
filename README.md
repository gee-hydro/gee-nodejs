<h1>GEE in Node.js</h1>

> Dongdong Kong, CUG

## 1. Development environment

### 1.1. GEE authentication

```bash
scoop install gcloud
## proxy for gcloud
# https://cloud.google.com/sdk/docs/proxy-settings?hl=zh-cn
gcloud config set proxy/type http
gcloud config set proxy/address 127.0.0.1
gcloud config set proxy/port 1081

earthengine authenticate
```

<!-- - `Private Key`: <https://developers.google.com/earth-engine/guides/service_account#create-a-private-key-for-the-service-account>
  
> `Private Key` should be at `~/.config/earthengine/.private-key.json`. -->


### 1.2. Node.js

```bash
npm install -g @google/earthengine require-from-url ijavascript
ijavascript
```

### 1.3. Jupyter

```bash
conda install nb_conda_kernels ipykernel
python -m ipykernel install --user --name=`YOUR_ENV_NAME`
```

## 2. Usage

### 2.1. Local model: `Jupyter Notebook`

> see examples at <https://github.com/gee-hydro/gee-nodejs/blob/master/ee_hello.ipynb>

### 2.2. Remote model: `GEE Code Editor online`

<https://code.earthengine.google.com/>
