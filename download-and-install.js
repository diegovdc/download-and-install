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
			err ? resolve("") : resolve(data)//we will not reject this, because we do not want to break the rest of the main Promise call, we handle the empty string in later in the main Promise
		)
	})

// installDependencies :: {dependencies: {}, *} -> ['dependency_name'] -> Promise Npm Installed Dependencies || 'Error'
// dependencies_to_install: [] - Installs all dependencies
// dependencies_to_install: [''] - Installs no dependencies
// dependencies_to_install: ['dependency_name'] - Installs selected dependencies
const installDependencies = (tmp_package_json, dependencies_to_install, {from_dev_dependencies = false, as_dev_dependencies = false}) =>{
	readToBuffer(process.cwd()+'/package.json')//el package json del proyecto actual
	.then(JSON.parse)
	.then(pkg => {
		let dependency_type = from_dev_dependencies ? 'devDependencies' : 'dependencies'
		let target_dependency_type = as_dev_dependencies ? 'devDependencies' : 'dependencies'
		let to_install = []
		let installed_with_other_version = []
		let dependencies = R.equals(dependencies_to_install, []) 
			? tmp_package_json[dependency_type]
			: R.pick(dependencies_to_install, tmp_package_json[dependency_type])// si recive [''], entonces devuelve un objeto
		
		if (pkg[target_dependency_type] === undefined) {
			pkg[target_dependency_type]	= {}
		}
		for(let dep in dependencies) {//TODO refactorizar en FP
			if (pkg[target_dependency_type][dep] === undefined) {//no instalada
				let version = dependencies[dep]
				to_install.push(dep+'@'+version)
			} else if(dependencies[dep] !== pkg[target_dependency_type][dep]) {//instalda con otra version
				installed_with_other_version.push([dep, dependencies[dep], pkg[target_dependency_type][dep]])
			} else if(dependencies[dep] === pkg[target_dependency_type][dep]) {//instalda con la misma version
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
		let save_as = as_dev_dependencies ? '-D' : '-S'
		let command = `npm i ${dependencies.to_install.join(' ')} ${save_as}`
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
	 	copyfiles(['tmp/'+from, to], {up: 1, soft: true}, resolve))



//downloadAndInstall :: 'git/repo' -> [['from/**', 'to']] -> ['downloaded_pkg_json_dependency'] -> {from_dev_dependencies, as_dev_dependencies} -> Promise
//Note that:
//downloaded_pkg_json_dependencies: [] - Installs all dependencies
//downloaded_pkg_json_dependencies: [''] - Installs no dependencies
//downloaded_pkg_json_dependencies: ['dependency_name'] - Installs selected dependencies
const downloadAndInstall = (git_repo, from_to_paths_arr, downloaded_pkg_json_dependencies, options,  fn) => {
	if (typeof fn !== 'function') { console.error('[download-and-install] A callback function is required as the last argument'); return}
	download(git_repo, 'tmp', function (err) {
	 console.log(err ? ('Repo download Error', err) : 'Repo downloaded!')
	 Promise.all(from_to_paths_arr.map(doCopy))
	 .then(_ => console.log('Archivos instaladas'))
	 .then(_ => readToBuffer(process.cwd()+'/tmp/package.json'))
	 .then(x => x === "" ?  console.log('El repositorio no tiene package.json') : JSON.parse(x))
	 .then(tmp_package_json => tmp_package_json === undefined ? undefined : installDependencies(tmp_package_json, downloaded_pkg_json_dependencies, options))
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
// downloadAndInstall('diegovdc/coral-mongo-tasks', [['specs/**', 'specs']], ["cheerio"], {from_dev_dependencies: true}, () => console.log('woohooo'))


