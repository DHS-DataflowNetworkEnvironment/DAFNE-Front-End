FROM httpd:2.4-alpine

# Installa strumenti utili per lo sviluppo dentro al devcontainer
# (bash e git sono spesso richiesti dalle estensioni VSCode)
RUN apk update && apk add --no-cache \
    bash \
    git \
    curl \
    nano \
    vim \
    openssh-client \
    shadow \
    sudo \
    nodejs \
    npm

# Crea un utente non-root per lavorare in VSCode (best practice)
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN addgroup -g $USER_GID $USERNAME \
    && adduser -D -u $USER_UID -G $USERNAME -s /bin/bash $USERNAME \
    && echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# Assicura che l'utente vscode possa scrivere nella document root di Apache
RUN chown -R $USERNAME:$USERNAME /usr/local/apache2/htdocs

WORKDIR /usr/local/apache2/htdocs

# Espone la porta standard di Apache
EXPOSE 80

# Mantiene l'utente root come default per far partire httpd
# (VSCode può comunque connettersi come "vscode" tramite remoteUser nel devcontainer.json)
CMD ["httpd-foreground"]