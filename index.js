const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function loadYaml(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return null;
    }
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return yaml.load(fileContents);
}

function resolveRefs(data, basePath) {
    if (typeof data === 'object' && data !== null) {
        if (Array.isArray(data)) {
            return data.map(item => resolveRefs(item, basePath));
        } else {
            const resolvedData = {};
            for (const [key, value] of Object.entries(data)) {
                if (key === '$ref' && typeof value === 'string' && value.startsWith('@/')) {
                    const refPath = path.join(basePath, value.slice(2));
                    const refData = loadYaml(refPath);
                    if (refData !== null) {
                        Object.assign(resolvedData, resolveRefs(refData, basePath));
                    }
                } else {
                    resolvedData[key] = resolveRefs(value, basePath);
                }
            }
            return resolvedData;
        }
    }
    return data;
}

function main() {
    const basePath = path.join(__dirname, 'src');
    const specPath = path.join(basePath, 'spec.yaml');
    
    const specData = loadYaml(specPath);
    if (specData === null) {
        console.error(`Failed to load spec file: ${specPath}`);
        return;
    }
    
    const resolvedData = resolveRefs(specData, basePath);
    
    const outputDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    const outputPath = path.join(outputDir, 'schema.yaml');
    fs.writeFileSync(outputPath, yaml.dump(resolvedData), 'utf8');
    
    console.log(`Resolved spec written to ${outputPath}`);
}

main();