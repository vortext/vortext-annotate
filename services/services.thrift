namespace java spa.services.services

include "structs.thrift"
include "exceptions.thrift"

service PDFParser {
        void ping(),
        // Calls the pdf parser to return, given a binary pdf (base64 encoded), the RawPDF
        structs.Document parse(1:string file)

        oneway void shutdown()
}

service Filter {
        void ping(),

        // Filters are elements of a pipeline.
        // They receieve a document and yield a different (modified) document
        structs.Document filter(1:structs.Document document) throws (1:exceptions.ProcessException error),

        oneway void shutdown()
}