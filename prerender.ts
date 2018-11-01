import 'zone.js/dist/zone-node';
import 'reflect-metadata';
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'fs';
import * as mkdirp from 'mkdirp';
import { join } from 'path';
import { enableProdMode } from '@angular/core';
import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';
import { renderModuleFactory } from '@angular/platform-server';
import { ROUTES } from './static-paths';

enableProdMode();

const serverDir = './server/';
const browserDir = './browser/';
const languageDirs = readdirSync(serverDir).filter(f => statSync(join(serverDir, f)).isDirectory());

languageDirs.forEach(prerenderLanguage);


function prerenderLanguage(dir) {

    // console.log(join(serverDir, dir, 'main'));
    // return;
    const { AppServerModuleNgFactory, LAZY_MODULE_MAP } = require('./' + join(serverDir, dir, 'main'));

    // Load the index.html file containing references to your application bundle.
    const index = readFileSync(join(browserDir, dir, 'index.html'), 'utf8');

    let previousRender = Promise.resolve();

    // Iterate each route path
    const OUT_FOLDER = join(process.cwd(), browserDir, dir);
    ROUTES.forEach(route => {
        const fullPath = join(OUT_FOLDER, route);
        const outFilePath = join(fullPath, 'index.html');
        console.log('RENDER', route, 'TO', outFilePath);

        // Make sure the directory structure is there
        if (!existsSync(fullPath)) {
            mkdirp.sync(fullPath);
        }

        // Writes rendered HTML to index.html, replacing the file if it already exists.
        previousRender = previousRender.then(_ => renderModuleFactory(AppServerModuleNgFactory, {
            document: index,
            url: route,
            extraProviders: [
                provideModuleMap(LAZY_MODULE_MAP)
            ]
        })).then(html => {
            console.log('WRITE', html.substr(0, 70));
            writeFileSync(outFilePath, html);
        });
    });
}


