# filetree-contents

Access filesystem subtree content via dot notation.

## Description

There are two different behaviours for production and non-production.

If `NODE_ENV` is **production**, then the module preloads the entire
directory structure upon initialization as a JavaScript object with
directory/file names as keys and file contents as
values. Subdirectories result in nested objects.

Otherwise, if `NODE_ENV` is any other value, a file is dynamically
read upon each request to get an up to date contect without
application restart.

## Usage

Here is an example of a directory structure with files:

```
testfiles
├── one
│   └── default.txt
└── second.txt
```

```js
import loader from 'filetree-contents';

const { files } = await loader({ path: 'testfiles', defaultExtension: '.txt' });

console.log(await files.one.default); // gives content of testfiles/one/default.txt
console.log(await files.second);      // gives content of testfiles/second.txt
```
