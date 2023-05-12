## Installing Docker on Ubuntu

1. Update the apt package index and install packages to allow apt to use a repository over HTTPS:

   ```bash
    sudo apt-get update
    sudo apt-get install \
      ca-certificates \
      curl \
      gnupg \
      lsb-release
   ```

1. Add Docker’s official GPG key:

   ```bash
   sudo mkdir -p /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   ```

1. Use the following command to set up the repository:
   ```bash
   echo \
     "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
     $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   ```
1. Update the apt package index:
   ```bash
   sudo apt-get update
   ```
1. Install Docker Engine, containerd, and Docker Compose.
   ```bash
   sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin
   ```
1. Verify that the Docker Engine installation is successful by running the hello-world image:
   ```bash
   sudo docker run hello-world
   ```
1. Install Docker Desktop for Linux
   - Download the `.deb` file from [Download Docker Desktop for Ubuntu](https://docs.docker.com/desktop/install/ubuntu/)
   - Go to downloads folder and right click `docker-desktop-<version>-<arch>.deb`
   - And select **Open With Other Application**
   - Then select **Software Install** option
   - Then click green **Install** button
   - Wait and let it do its thing.
1. Intall `docker compose`
   ```bash
   sudo apt-get update
   sudo apt-get install docker-compose-plugin
   ```
   Verify that Docker Compose is installed correctly by checking the version.
   ```bash
   docker compose version
   ```
   Above command should print:  
   `Docker Compose version vN.N.N`
