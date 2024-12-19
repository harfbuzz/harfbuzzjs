FROM ubuntu:22.04

#---------------------------------------------
# See: https://github.com/harfbuzz/harfbuzzjs
#---------------------------------------------

SHELL ["/bin/bash", "-c"]

ENV NVM_DIR=/build/nvm
ENV NVM_VERSION=0.40.1
ENV NODE_VERSION=18.4.0
ENV EMSDK_VERSION=3.1.56

# for `npx pad.js`
EXPOSE 9090/tcp

# Update the $PATH to make your installed `node` and `npm` available!
ENV PATH=$NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

RUN apt update -y \
  && apt upgrade -y

RUN apt install -y \
  git \
  nodejs \
  python3 \
  xz-utils \
  cmake curl \
  binaryen

RUN set -x \
  && cd / \
  && git clone https://github.com/emscripten-core/emsdk.git \
  && cd emsdk \
  && git pull \
  && ./emsdk install $EMSDK_VERSION \
  && ./emsdk activate $EMSDK_VERSION \
  && source ./emsdk_env.sh \
  && mkdir -p $NVM_DIR \
  && curl https://raw.githubusercontent.com/creationix/nvm/v$NVM_VERSION/install.sh | bash \
  && . $NVM_DIR/nvm.sh \
  && nvm install $NODE_VERSION \
  && nvm alias default $NODE_VERSION \
  && nvm use default \
  && node -v \
  && npm -v

#-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!
# chai (and mocha) need to be installed locally!
# chai CANNOT be found if only installed globally :-(
#
# *INSTEAD* Use ./npm-install.sh
# This creates ./node_modules in the current app directory
# and downloads all the required npm modules for `npm test`
# Only needs to be called once within the docker container.
#-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!


# Essential to get EM++ to work!
# (From terminal this is set in the `source ./emsdk_env.sh` script)
ENV PATH=/emsdk/upstream/emscripten:/emsdk:$PATH

WORKDIR /app
