Dependencies:
- npm install electron-packager -g

Module page/instructions:
- https://www.npmjs.com/package/electron-packager
- https://www.christianengvall.se/electron-packager-tutorial/
- https://fearby.com/article/create-first-hello-world-electron-app-osx/
- https://superuser.com/questions/1255991/zip-with-symlink-in-it

Notes for IOS:
- The build command must be runned using a bash console with admin priveleges if building from windows
- We need to add the "Start" script into the package.json file; (3rd url)
- We need to place all of the content inside a .tar file, if building on windows, using 7-zip or else the app won't run (because of the support diferences on symlinks between OS's)

Linux:
- After removing the files from the zip folder on linux, we should run the command chomod 777 * on the project folder to ensure that everything runs ok.

Extra:
- We can add the run commands mencioned in the second url, to "automize" the builds
