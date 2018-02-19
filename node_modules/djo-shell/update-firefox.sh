#!/usr/bin/env bash

FF_CDN="http://download.cdn.mozilla.net/pub/mozilla.org/firefox/releases";
FF_PLATFORM=$(echo "$(uname -s)-$(uname -m)" | tr '[:upper:]' '[:lower:]');
FF_LOCALE='en-US';

function getFirefox {
  local targetUrl

  while [ $1 ]; do
    # update the target url
    targetUrl="$FF_CDN/$1/$FF_PLATFORM/$FF_LOCALE/firefox-$1.tar.bz2"

    if [ ! -d ~/browsers/firefox/$1 ]; then
      # get the browser
      echo "getting $targetUrl";
      wget $targetUrl -O /tmp/firefox-$1.tar.bz2 --progress=bar

      # create the directory for firefox
      mkdir -p ~/browsers/firefox

      # extract the files into the browser directory
      echo "extracting firefox $1"
      tar xf /tmp/firefox-$1.tar.bz2 -C ~/browsers/firefox
      mv ~/browsers/firefox/firefox ~/browsers/firefox/$1
    fi

    # next
    shift;
  done
}

# ensure we have a browsers directory
mkdir -p ~/browsers

# install required firefox versions
getFirefox 27.0.1 28.0b7