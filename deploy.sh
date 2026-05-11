#!/bin/bash

git checkout chirag
git pull origin chirag

git checkout prod
git checkout chirag -- backend
git add .
git commit -m "updated"
git push origin prod