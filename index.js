import { promises as fs } from 'node:fs';
import { resolve, basename } from 'path';

const GetFileContents = async ({ path, defaultExtension }) => {
    for (const target of [path, path + defaultExtension]) {
        try {
            return await fs.readFile(target, { encoding: 'utf8' });
        } catch (err) {
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }
    }
    throw new Error(`File not found: ${path}`);
};

// Preload entire directory tree into object for production
const GetTree = async ({ path, defaultExtension }) => {
    const subdirs = await fs.readdir(path);
    const files = await Promise.all(
        subdirs.map(async subdir => {
            const fileName = resolve(path, subdir);
            const isDirectory = (await fs.stat(fileName)).isDirectory();
            const content = await (isDirectory ? GetTree : GetFileContents)({
                path: fileName,
                defaultExtension
            });
            return {
                [subdir]: content,
                ...(isDirectory
                    ? {}
                    : { [basename(subdir, defaultExtension)]: content })
            };
        })
    );
    return Object.assign({}, ...files);
};

// Load file upon each request for development
const DynamicLoader = ({ path, defaultExtension }) =>
    new Proxy(() => GetFileContents({ path, defaultExtension }), {
        get: (obj, prop) =>
            prop === 'then'
                ? (o => o.then.bind(o))(obj())
                : DynamicLoader({
                      path: resolve(path, prop),
                      defaultExtension
                  })
    });

const entry = process.env.NODE_ENV === 'production'
        ? async opts => ({ files: await GetTree(opts) })
        : opts => ({ files: DynamicLoader(opts) });

export default entry;
