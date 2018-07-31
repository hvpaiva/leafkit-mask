#!/usr/bin/env bash

set -e
echo "Informe a versão da release: "
read VERSION

read -p "Releasing $VERSION - tem certeza? (s/n)" -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Ss]$ ]]
then
  echo "Releasing $VERSION ..."
  # npm test
  VERSION=$VERSION npm run build

  # commit
  git add -A
  git commit -m "[build] $VERSION"
  npm version $VERSION --message "[release] $VERSION"

  # publish
  git push origin refs/tags/v$VERSION
  git push
  npm publish
fi