SEC=secure.json

.PHONY: all clean

all: secure.json
	@node ./jiffy-to-tks.js | tee -a timesheet.txt && echo "Saved timesheet.txt"

clean:
	rm -f timesheet.txt secure.json

$(SEC): $(SEC).pgp
	gpg --yes -d -o $@ $<

secure: $(SEC)
	gpg --yes -sac -o $(SEC).pgp $<

