    Try.astuple(result) -> (value,) or ()
    Try.astuple(Ok(value)) -> (value,)
    Try.astuple(::Err) -> ()
    Try.astuple(Some(value)) -> (value,)
    Try.astuple(nothing) -> ()

Return a singleton tuple with the value if the result is "successful"; return an empty tuple
otherwise.

# Examples
```julia
julia> using Try

julia> Try.astuple(Ok(1))
(1,)

julia> Try.astuple(Err(1))
()

julia> Try.astuple(Some(1))
(1,)

julia> Try.astuple(nothing)
()
```
