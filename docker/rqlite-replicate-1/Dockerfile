FROM rqlite/rqlite:7.21.1

CMD ["rqlited", "-http-addr", "rqlite-replicate-1:4001", "-raft-addr", "rqlite-replicate-1:4002", "-join", "http://rqlite-master:4001", "/rqlite/file/data"]