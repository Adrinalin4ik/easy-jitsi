#!/usr/bin/env bash
BASE_FIREFOX=archive.mozilla.org/pub/firefox
BASE_FIREFOX_RELEASE=$BASE_FIREFOX/releases

declare -A FIREFOX_VERSION_URLS
FIREFOX_VERSION_URLS[stable]=$BASE_FIREFOX_RELEASE/latest/linux-x86_64/en-US/
FIREFOX_VERSION_URLS[beta]=$BASE_FIREFOX_RELEASE/latest-beta/linux-x86_64/en-US/
FIREFOX_VERSION_URLS[esr]=$BASE_FIREFOX_RELEASE/latest-esr/linux-x86_64/en-US/
FIREFOX_VERSION_URLS[nightly]=$BASE_FIREFOX/nightly/latest-trunk/

extractFirefoxVersion() {
  echo $1 | sed -r "s/^.*firefox-([0-9\.ba]+)\..*tar.bz2$/\1/"
}

getChromeVersion() {
  case $1 in
    unstable)
      VERSION=`curl -s http://omahaproxy.appspot.com/all | grep ^linux\,dev | cut -d',' -f3`
      ;;
    *)
      VERSION=`curl -s http://omahaproxy.appspot.com/all | grep ^linux\,$1 | cut -d',' -f3`
      ;;
  esac
  
  echo "chrome|$1|$VERSION|https://dl.google.com/linux/direct/google-chrome-$1_current_amd64.deb"
}

getFirefoxFilename() {
  local directory_url="${1}"
  echo "http://${directory_url}$(curl -s http://"${directory_url}" | grep -e \.tar\.bz2 | sed -r 's/^.*(firefox-[0-9\.ba]+\..*tar.bz2).*/\1/' | tail -n 1)"
}

getNightlyFirefoxFilename() {
  local directory_url="${1}"
  echo "http://${directory_url}$(curl -s http://"${directory_url}" | grep -e \.linux-x86_64\.tar\.bz2 | sed -r 's/^.*(firefox-[0-9\.ba]+\..*tar.bz2).*/\1/' | tail -n 1)"
}

getFirefoxVersion() {
  local firefox_version="$1"
  local firefox_url

  case "${firefox_version}" in
    nightly)
      firefox_url=$(getNightlyFirefoxFilename ${FIREFOX_VERSION_URLS[$firefox_version]})
      ;;
    *)
      firefox_url=$(getFirefoxFilename ${FIREFOX_VERSION_URLS[$firefox_version]})
      ;;
  esac
  
  echo "firefox|$1|$(extractFirefoxVersion $firefox_url)|$firefox_url"
}

case $1 in
  chrome)
    getChromeVersion $2
    ;;
  
  firefox)
    getFirefoxVersion $2
    ;;
esac
