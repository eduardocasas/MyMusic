from django.conf.urls import patterns, include, url
from django.contrib import admin
from myapp.views import user
from myapp.views import home
from django.conf import settings

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^'+settings.MY_SLUG+'$', user.requires_login, { 'view': home.index }, name="home"),
    url(r'^'+settings.MY_SLUG+'admin/', include(admin.site.urls)),
    url(r'^'+settings.MY_SLUG+'login/$', user.requires_logout, { 'view': user.app_login }, name="login"),
    url(r'^'+settings.MY_SLUG+'logout/$', user.requires_login, { 'view': user.app_logout }, name="logout"),
    url(r'^'+settings.MY_SLUG+'collection/', user.requires_login, { 'view': home.play }, name='play'),
)