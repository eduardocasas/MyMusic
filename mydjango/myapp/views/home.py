from django.shortcuts import render
from django.http import HttpResponse
import os
from os.path import isfile, join, isdir, splitext
import mimetypes
from django.conf import settings
from mutagen.mp3 import MP3

def paintView(request, path, view):
    x = os.listdir(path)
    y = [i.decode('utf-8') for i in x]
    items = sorted(y)
    files = []
    for f in items:
        file_path = join(path,f).encode('utf-8')
        fileName, file_extension = splitext(file_path)
        if isfile(file_path) and file_extension.lower() == '.mp3':
            audio = MP3(file_path)
            files.append({ 'name' : f, 'length' : "{0}".format(round(audio.info.length, 0))[:-2]})
    sub_path = settings.MY_MUSIC_FOLDER
    path_items = []
    path_items_name = []
    path_items.append({'name': 'home', 'url': '/'+settings.MY_SLUG+'?path='+sub_path})
    if (path !=  settings.MY_MUSIC_FOLDER):
        for item in path.replace(settings.MY_MUSIC_FOLDER, '').strip('/').split('/'):
            sub_path += '/'+item
            path_items.append({'name': item, 'url': '/'+settings.MY_SLUG+'?path='+sub_path})
            path_items_name.append(item)
        path_items_name.reverse()
    return render(
        request,
        view,
        {
            'path'            : path,
            'files'           : files,
            'folders'         : [ f for f in items if isdir(join(path,f).encode('utf-8')) ],
            'my_slug'         : settings.MY_SLUG,
            'path_items'      : path_items,
            'path_items_name' : path_items_name,
            'home_path'       : settings.MY_MUSIC_FOLDER,
        }
    )

def openFolderAction(request):
    return paintView(request, request.POST['new_path'], 'home/partial.html')

def backAction():
    return HttpResponse("ok")

def play(request):
    filename = request.GET.get('path')
    mimetype, encoding = mimetypes.guess_type(filename)
    with open(filename, 'rb') as f:
        response = HttpResponse(f.read(), mimetype=mimetype)                                    
    response['Content-Length'] = os.path.getsize(filename)
    response["Content-Encoding"] = encoding
    return response

def index(request):
    if request.is_ajax() and request.POST['ajax_action'] == 'openFolderAction':
        return openFolderAction(request)
    elif request.GET.get('path'):
        return paintView(request, request.GET.get('path'), 'home/index.html')
    else:
        return paintView(request, settings.MY_MUSIC_FOLDER, 'home/index.html')