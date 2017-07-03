#! /usr/bin/env node
const download = require('download-git-repo')
const fs = require('fs')
const child_process = require('child_process')

const dependencies = {
	"data.task": "3.1.1",
	'ramda': '0.23.0'
}

const readToBuffer = path => 
	new Promise((resolve, reject) => {
		return fs.readFile(path,{encoding: 'utf8'}, (err, data) => 
			err ? reject(err) : resolve(data)
		)
	})

readToBuffer('micorriza.js').then(console.log).catch(e => console.log('error'))

const installDependencies = () => {
	readToBuffer(process.cwd()+'/package.json')
		.then(JSON.parse)
		.then(pkg => {
			let to_install = []
			let installed_with_other_version = []
			for(dep in dependencies) {
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
			let command = `npm i ${to_install.join(' ')} -S`
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
if (false) {
	
installDependencies()
}