#!/usr/bin/env bash

# # bootstrap-desktop.sh
# 
# This is a  shell script that is designed to take a barebones ubuntu server
# install, and install the bits and pieces required to make it a functioning
# development desktop environment. Basically I've broken too many desktop
# configurations in the past so I now only work in a rebuildable VM environment
# that I know I can rebuild easily.
#
# To execute this script, run the following:
# 
# To be completed

# a few defines
VERSION_SOURCECODEPRO=1.017

# install required dependencies to get up and running
sudo apt-get -y install \
    build-essential \
    curl unzip \
    git \
    xinit \
    awesome \
    synapse lxterminal \
    virtualbox-ose-guest-utils virtualbox-ose-guest-x11 virtualbox-ose-guest-dkms
    
# clone dotfiles
if [[ ! -d ~/dotfiles ]]; then
  git clone https://github.com/DamonOehlman/dotfiles.git ~/dotfiles
fi

# initialise helpful links
rm -rf ~/.config
ln -s ~/dotfiles/config ~/.config
ln -fs ~/dotfiles/.bashrc-custom ~/.bashrc-custom

if [[ ! $(cat ~/.bashrc | grep bashrc-custom) ]];
then
  printf "\n. ~/.bashrc-custom\n" >> ~/.bashrc
fi

# ensure we have a Downloads folder
mkdir -p ~/Downloads

# install the adobe source code pro font
if [[ ! -d ~/.fonts/SourceCodePro ]]; then
  rm -rf ~/Downloads/SourceCodePro*
  wget http://downloads.sourceforge.net/project/sourcecodepro.adobe/SourceCodePro_FontsOnly-${VERSION_SOURCECODEPRO}.zip -O ~/Downloads/SourceCodePro.zip
  unzip ~/Downloads/SourceCodePro.zip -d ~/Downloads
  mkdir -p ~/.fonts
  mv ~/Downloads/SourceCodePro_* ~/.fonts/SourceCodePro
  fc-cache -vf
fi

# bring in bashinate
if [[ ! -e ~/bin/bashinate ]]; then
  mkdir -p ~/bin
  wget https://bitbucket.org/DamonOehlman/bashinate/raw/master/bashinate -O ~/bin/bashinate
  chmod a+x ~/bin/bashinate
fi