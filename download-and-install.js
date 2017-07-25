#! /usr/bin/env node
const download = require('download-git-repo')
const copyfiles = require('copyfiles')
const rimraf = require('rimraf')
const fs = require('fs')
const child_process = require('child_process')
const R = require('ramda')

const readToBuffer = path => 
	new Promise((resolve, reject) => {
		return fs.readFile(path,{encoding: 'utf8'}, (err, data) => 
			err ? resolve("") : resolve(data)
		)
	})

// installDependencies :: {dependencies: {}, *} -> ['dependency_name'] -> Promise Npm Installed Dependencies || 'Error'
// dependencies_to_install: [] - Installs all dependencies
// dependencies_to_install: [''] - Installs no dependencies
// dependencies_to_install: ['dependency_name'] - Installs selected dependencies
const installDependencies = (tmp_package_json, dependencies_to_install) =>{
	readToBuffer(process.cwd()+'/package.json')//el package json del proyecto actual
	.then(JSON.parse)
	.then(pkg => {
		let to_install = []
		let installed_with_other_version = []
		let dependencies = R.equals(dependencies_to_install, []) 
			? tmp_package_json.dependencies
			: R.pick(dependencies_to_install, tmp_package_json.dependencies)// si recive [''], entonces devuelve un objeto
		
		for(let dep in dependencies) {//TODO refactorizar en FP
			if (pkg.dependencies[dep] === undefined) {//no instalada
				let version = dependencies[dep]
				to_install.push(dep+'@'+version)
			} else if(dependencies[dep] !== pkg.dependencies[dep]) {//instalda con otra version
				installed_with_other_version.push([dep, dependencies[dep], pkg.dependencies[dep]])
			} else if(dependencies[dep] === pkg.dependencies[dep]) {//instalda con la misma version
				//do nothing
			}
		}

		return {to_install, installed_with_other_version}
	})
	.then(dependencies => {
		let already_installed_messages = 
			dependencies.installed_with_other_version.map(dep => {
				return `La dependencia "${dep[0]}", se encuentra ya instalada con la version "${dep[2]}", por lo que no se ha instalado la version "${dep[1]}"... esto podría causar algun problema`;
			}).join('\n')

		if (dependencies.to_install.length === 0) {
			console.log('No ha sido necesario instalar nada');
			console.log(already_installed_messages);
			return
		}
		console.log('Instalando...');
		let command = `npm i ${dependencies.to_install.join(' ')} -S`
		child_process.exec(command, (err, stdout, stderr) => {

			if (err) {
				console.log(err);
				console.log(stderr);
			} else {
				console.log(stdout);
				console.log(already_installed_messages);
			}
		})
	})
	.catch(e => console.log(e))
}

const doCopy = ([from, to]) => 
	 new Promise((resolve, reject) => 
	 	copyfiles(['tmp/'+from, to], {up: true, soft: true}, resolve))



//downloadAndInstall :: 'git/repo' -> [['from/**', 'to']] -> ['downloaded_pkg_json_dependency']
//Note that:
//downloaded_pkg_json_dependencies: [] - Installs all dependencies
//downloaded_pkg_json_dependencies: [''] - Installs no dependencies
//downloaded_pkg_json_dependencies: ['dependency_name'] - Installs selected dependencies
const downloadAndInstall = (git_repo, from_to_paths_arr, downloaded_pkg_json_dependencies, fn) => {
	if (typeof fn !== 'function') {
		console.error('[download-and-install] A callback function is required as the last argument');
	}
	download(git_repo, 'tmp', function (err) {
	 console.log(err ? ('Repo download Error', err) : 'Repo downloaded!')
	 Promise.all(from_to_paths_arr.map(doCopy))
	 .then(_ => console.log('Archivos instaladas'))
	 .then(_ => readToBuffer(process.cwd()+'/tmp/package.json'))
	 .then(x => x === "" ?  console.log('El repositorio no tiene package.json') : JSON.parse(x))
	 .then(tmp_package_json => tmp_package_json === undefined ? undefined : installDependencies(tmp_package_json, downloaded_pkg_json_dependencies))
	 .then(_ => new Promise((resolve, reject) => rimraf(process.cwd()+'/tmp', resolve)))
	 .then(_ => console.log('directorio temporal removido'))
	 .then(fn)
	 .catch(e =>console.log(e))
	})	
}

module.exports = downloadAndInstall


//inline tests, sorry :(
// downloadAndInstall('flipxfx/download-git-repo-fixture', [['core/**', 'core'],['foo/*', 'foo']], [], ()=>console.log('wooo'))
// downloadAndInstall('diegovdc/mazorca', [['core/**', 'core'],['foo/*', 'foo']], [''], () => console.log('woohooo'))
// downloadAndInstall('diegovdc/coral-mongo-tasks', [['specs/**', 'specs']], ["data.task"], () => console.log('woohooo'))


