from django.shortcuts import render
from django.http import HttpResponseRedirect
from myapp.forms.login import LoginForm
from django.contrib.auth import authenticate, login, logout
from django.conf import settings

def requires_login(request, view):
    if not request.user.is_authenticated():
        return HttpResponseRedirect('/'+settings.MY_SLUG+'login/')
    return view(request)

def requires_logout(request, view):
    if request.user.is_authenticated():
        return HttpResponseRedirect('/'+settings.MY_SLUG)
    return view(request)
   
def app_login(request):
    if request.method == 'POST':
        form = LoginForm(request.POST)
        user = authenticate(username=request.POST['username'], password=request.POST['password'])
        if user is not None:
            if user.is_active:
                login(request, user)
                return HttpResponseRedirect('/'+settings.MY_SLUG)
    else:
        form = LoginForm()
    return render(request, 'user/login.html', { 'form': form })


def app_logout(request):
    logout(request)
    return HttpResponseRedirect('/'+settings.MY_SLUG)