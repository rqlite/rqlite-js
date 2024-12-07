FROM rqlite/rqlite:8.34.3

CMD ["rqlited", "-http-addr", "rqlite-replicate-1:4001", "-raft-addr", "rqlite-replicate-1:4002", "-join", "http://rqlite-master:4001", "/rqlite/file/data"]