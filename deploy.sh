#!/bin/bash

git checkout back-end-1
git pull origin back-end-1

git checkout prod
git checkout back-end-1 -- backend
git add .
git commit -m "updated"
git push origin prod