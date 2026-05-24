mpaint
======

Collaborative paint application.

[Demo instance](https://mpaint.onrender.com/) (email: `demo1@localhost`, password: `demopassword1`; `demo2`, `demo3`, …, `demo9` exist as well)

Deployment
----------

With Docker:

```
docker build -t mpaint .
docker run -p 9999:80 -e RAILS_MASTER_KEY=`cat config/master.key` --name mpaint mpaint
```

The application should be reachable from http://localhost:9999/.

Development
-----------

The application has been verified to work on Ruby 3.3.11.

Install the dependencies:

```
bundle install
```

Run the dev server:

```
bin/dev
```

Consult the [Rails guides](https://guides.rubyonrails.org/v8.0/index.html) for help on development.
