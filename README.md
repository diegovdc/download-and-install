# Download and Install

Este módulo descarga un repositorio de Github. El repositorio puede tener un package.json cuyas dependencias se desean instalar, sin sobreescribir alguna dependencia que tenga una versión diferente de aquella con la que cuenta el package.json del proyecto.

## Uso

`npm i download-and-install -S`

```
const downloadAndInstall = require('download-and-install')

// First arguement: the git repo, 
// Second argument: an array of pairs, the first is glob that specifies the path inside the repo, the second a path to where the file or files are going to be copied
// Third argument: an array of package.json dependencies that we wish to install (pass [], to install all, and [''] to not install any of them)
// Fourth is a callback function
// All arguments are required
downloadAndInstall('diegovdc/coral-mongo-tasks', [['specs/**', 'specs']], ['data.task'], () => console.log('all done'))

```


