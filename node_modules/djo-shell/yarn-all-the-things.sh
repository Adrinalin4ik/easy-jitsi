#!/usr/bin/env bash
for dir in *; do
  if [ -d "${dir}" ]; then
    pushd "$dir" > /dev/null

    if [ -e package.json ] && [ ! -f .yarn-resync-fail ]; then
      echo "reinstalling packages with yarn for: ${dir}"
      rm -rf node_modules

      # install node modules and cache aggressively as per discussion
      # https://github.com/nolanlawson/local-npm/pull/122#issue-154909382
      yarn install

      # if npm failed, then abort
      if [ $? -ne 0 ]; then
        touch .yarn-resync-fail
      fi
    fi

    popd > /dev/null
  fi
done
