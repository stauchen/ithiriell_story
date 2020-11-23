dev: 
	tweego --watch -o dist/index.html -m modules src
build:
	tweego -o dist/index.html -m modules src