    Try.transpose(result_of_maybe) -> maybe_of_result
    Try.transpose(maybe_of_result) -> result_of_maybe

Transpose `Union{Ok,Err}` wrapped in `Union{Some,Nothing}` and vice versa.

# Extended help
## Examples
```julia
using Try

@assert Try.transpose(Ok(nothing)) === nothing
@assert Try.transpose(Ok(Some(1))) === Some(Ok(1))
@assert Try.transpose(Err(:error)) === Some(Err(:error))
@assert Try.transpose(Some(Ok(1))) === Try.Ok(Some(1))
@assert Try.transpose(Some(Err(:error))) === Try.Err(:error)
@assert Try.transpose(nothing) === Try.Ok()
```
