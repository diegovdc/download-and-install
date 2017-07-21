#! /usr/bin/env node
const download = require('download-git-repo')
const copyfiles = require('copyfiles');
const rimraf = require('rimraf')
const fs = require('fs')
const child_process = require('child_process')

let tmp_package_json;

const readToBuffer = path => 
	new Promise((resolve, reject) => {
		return fs.readFile(path,{encoding: 'utf8'}, (err, data) => 
			err ? resolve("") : resolve(data)
		)
	})


const installDependencies = tmp_package_json =>{
	readToBuffer(process.cwd()+'/package.json')//el package json del proyecto actual
	.then(JSON.parse)
	.then(pkg => {
		let to_install = []
		let installed_with_other_version = []
		for(dep in tmp_package_json.dependencies) {
			if (pkg.dependencies[dep] === undefined) {//no instalada
				let version = tmp_package_json.dependencies[dep]
				to_install.push(dep+'@'+version)
			} else if(tmp_package_json.dependencies[dep] !== pkg.dependencies[dep]) {//instalda con otra version
				installed_with_other_version.push([dep, tmp_package_json.dependencies[dep], pkg.dependencies[dep]])
			} else if(tmp_package_json.dependencies[dep] === pkg.dependencies[dep]) {//instalda con la misma version
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
	 	copyfiles([from, to], {up: true, soft: true}, resolve))


const downloadAndInstall = (git_repo, from_to_paths_arr) => {
	download(git_repo, 'tmp', function (err) {
	 console.log(err ? ('Repo download Error', err) : 'Repo downloaded!')
	 Promise.all(from_to_paths_arr.map(doCopy))
	 .then(x => console.log('Archivos instaladas'))
	 .then(x => readToBuffer(process.cwd()+'/tmp/package.json'))
	 .then(x => x === "" ?  console.log('El repositorio no tiene package.json') : JSON.parse)
	 .then(tmp_package_json => tmp_package_json === undefined ? undefined : installDependencies(tmp_package_json))
	 .then(x => new Promise((resolve, reject) => rimraf(process.cwd()+'/tmp', resolve)))
	 .then(x => console.log('directorio temporal removido'))
	 .catch(e =>console.log(e))
	})	
}

downloadAndInstall('flipxfx/download-git-repo-fixture', [['tmp/core/**', 'core'],['tmp/foo/*', 'foo']])
downloadAndInstall('diegovdc/mazorca', [['tmp/core/**', 'core'],['tmp/foo/*', 'foo']])


