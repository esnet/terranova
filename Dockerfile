FROM python:3.11-alpine

WORKDIR /terranova

RUN apk add --no-cache gcc g++ musl-dev patchelf graphviz graphviz-dev supervisor apache2 apache2-proxy
RUN pip install --no-cache-dir "cython<3.0.0" wheel
RUN echo "cython<3" > /tmp/constraint.txt

COPY requirements.txt ./
RUN PIP_CONSTRAINT=/tmp/constraint.txt pip install --no-cache-dir -r requirements.txt

COPY . .

RUN PIP_CONSTRAINT=/tmp/constraint.txt pip install -e /terranova/

ADD config/supervisord.conf /etc/supervisord.conf
ADD config/httpd.conf /etc/apache2/httpd.conf
ADD config/settings.js /terranova/static/settings.js
ADD etc/terranova/settings.yml /etc/terranova/settings.yml

COPY config/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]