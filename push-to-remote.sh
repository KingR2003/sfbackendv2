#!/bin/bash
# Script to push the local root structure into the backend/ folder of the remote back-end-1 branch

echo "Creating isolated Git index..."
export GIT_INDEX_FILE=.git/temp_index
rm -f .git/temp_index

echo "Loading files into backend/ directory in memory..."
git read-tree --empty
git read-tree --prefix=backend/ HEAD

echo "Writing tree and generating commit..."
TREE=$(git write-tree)
COMMIT=$(git commit-tree $TREE -p HEAD -m "Move all code to backend folder (Automated)")

echo "Force pushing to sf-app branch back-end-1..."
git push sf-app $COMMIT:back-end-1 -f

echo "Cleaning up..."
rm -f .git/temp_index
unset GIT_INDEX_FILE

echo "Done! The remote has been updated."
