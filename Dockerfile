FROM node:4.3.0

RUN useradd -m -s /bin/bash user

USER user

WORKDIR /opt

CMD ["bash"]

