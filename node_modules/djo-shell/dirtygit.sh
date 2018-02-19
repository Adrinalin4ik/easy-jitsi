#!/usr/bin/env bash

# bootstrap the bash require environment
DIRTY=0

for dir in *; do
  if [ -d "${dir}" ]; then
    pushd "$dir" > /dev/null

    if [ -d .git ]; then
      # check for new or modified files, AND
      # check for out of sync with upstream branches
      # TODO: improve the upstream sync detection problems
      if [ `git status --porcelain | wc -c` -ne "0" ] || [ `git status -sb | cut -d' ' -f3 | wc -c` -ne "1" ]; then
        echo $dir
        DIRTY=1
      fi
    fi

    popd > /dev/null
  fi
done

exit $DIRTY
