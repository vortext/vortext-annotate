{:n  (fnk [xs]   (count xs))
 :m  (fnk [xs n] (/ (sum identity xs) n))
 :m2 (fnk [xs n] (/ (sum #(* % %) xs) n))
 :v  (fnk [m m2] (- m2 (* m m)))}
