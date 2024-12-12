rem Windows Docker run
rem NOTE: `/app` within Linux will be this directory in Windows
rem       so it emits the build straight to Windows without any other operation
docker run --rm -it -v %cd%:/app -w /app harfbuzzjs:0.4.3