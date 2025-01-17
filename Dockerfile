FROM ruby:2.6.2

ENV GITHUB_ACCESS_TOKEN 64c71977864b90d7788a7aebce9657cf890a3e18

RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libpq-dev &&\
    curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install -y nodejs yarn postgresql-client

RUN git clone -b docker-changes https://github.com/JDkaushal/docker-juliedesk-backoffice.git
WORKDIR "/docker-juliedesk-backoffice"


COPY Gemfile Gemfile.lock ./
RUN pwd

RUN bundle install
COPY package.json .
COPY yarn.lock .
RUN yarn install


# Add a script to be executed every time the container starts.
# COPY entrypoint.sh /usr/bin/
# RUN chmod +x /usr/bin/entrypoint.sh
# ENTRYPOINT ["entrypoint.sh"]
EXPOSE 3000
# Configure the main process to run when running the image
# CMD ["rails", "server", "-b", "-p", "3001", "0.0.0.0"]