#!/usr/bin/env bash
getopts ":r:" RECURSE

for dir in *; do
  if [ -d "${dir}" ]; then
    pushd "$dir" > /dev/null

    if [ -e package.json ]; then
      echo "reinstalling packages with npmd for: ${dir}"
      rm -rf node_modules
      npmd install

      # if npmd failed, then abort
      if [ $? -ne 0 ]; then
        exit $?
      fi
    elif [ $RECURSE = ":" ]; then
     npmd-all-the-things -r
    fi

    popd > /dev/null
  fi
done
